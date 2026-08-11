import { useState } from 'react';
import { ROLES, type ManagedUser, type Role } from '@repo/contracts';
import { ROLE_LABELS } from '../../../components/navigation';
import { ApiRequestError } from '../../../lib/http';
import { useDeleteUser, useUsers } from '../api/admin-queries';
import { Paginacion } from './paginacion';
import { UserForm } from './user-form';
import { ResetPasswordDialog } from './reset-password-dialog';

export function UsersTable({ sessionUserId }: { sessionUserId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [editando, setEditando] = useState<ManagedUser | null>(null);
  const [creando, setCreando] = useState(false);
  const [restableciendo, setRestableciendo] = useState<ManagedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const users = useUsers({ page, ...(search ? { search } : {}), ...(role ? { role } : {}) });
  const remove = useDeleteUser();

  async function handleDelete(user: ManagedUser) {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.email}? Sus inscripciones se conservan.`)) {
      return;
    }
    setError(null);
    try {
      await remove.mutateAsync(user.id);
    } catch (cause) {
      setError(cause instanceof ApiRequestError ? cause.message : 'No se pudo eliminar.');
    }
  }

  return (
    <>
      <h1>Usuarios</h1>

      <div className="barra-filtros">
        <label htmlFor="buscar" className="visualmente-oculto">
          Buscar
        </label>
        <input
          id="buscar"
          type="search"
          placeholder="Documento o correo…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <label htmlFor="rol" className="visualmente-oculto">
          Filtrar por rol
        </label>
        <select
          id="rol"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | '');
            setPage(1);
          }}
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>

        <button type="button" className="boton boton--primario" onClick={() => { setCreando(true); }}>
          Crear cuenta
        </button>
      </div>

      {error && (
        <p className="aviso-caja aviso-caja--error" role="alert">
          {error}
        </p>
      )}

      {users.isPending && <p role="status">Cargando…</p>}

      {users.data && (
        <>
          <div className="tabla-envoltorio">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Documento</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      {u.isSystem && <span className="etiqueta-rol">sistema</span>}
                    </td>
                    <td>
                      {u.documentType} {u.documentNumber}
                    </td>
                    <td>{ROLE_LABELS[u.role]}</td>
                    <td className="tabla__acciones">
                      <button type="button" onClick={() => { setEditando(u); }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => { setRestableciendo(u); }}>
                        Contraseña
                      </button>
                      {/* La acción se oculta cuando no procede, pero el servidor
                          la rechaza igual: ocultar un botón no es protección. */}
                      {!u.isSystem && u.id !== sessionUserId && (
                        <button type="button" onClick={() => void handleDelete(u)}>
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.data.items.length === 0 && <p>No hay cuentas que coincidan.</p>}

          <Paginacion
            page={users.data.page}
            total={users.data.total}
            pageSize={users.data.pageSize}
            onChange={setPage}
          />
        </>
      )}

      {creando && <UserForm onClose={() => { setCreando(false); }} />}
      {editando && <UserForm user={editando} onClose={() => { setEditando(null); }} />}
      {restableciendo && (
        <ResetPasswordDialog user={restableciendo} onClose={() => { setRestableciendo(null); }} />
      )}
    </>
  );
}
