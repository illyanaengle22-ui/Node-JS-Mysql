import { useMemo, useState } from 'react';

export default function CrudTable({
  columns,
  rows,
  actions,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  emptyMessage = 'No hay registros',
}) {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  // Filtro
  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return rows;
    const q = busqueda.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const val = c.getSearchValue ? c.getSearchValue(r) : r[c.key];
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [rows, busqueda, columns]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * pageSize;
  const visibles = filtradas.slice(inicio, inicio + pageSize);
  const fin = Math.min(inicio + pageSize, filtradas.length);

  // Rango de páginas a mostrar
  const rangoPaginas = () => {
    const total = totalPaginas;
    const actual = paginaActual;
    const delta = 1;
    const paginas = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= actual - delta && i <= actual + delta)) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== '...') {
        paginas.push('...');
      }
    }
    return paginas;
  };

  return (
    <div className="crud-card">
      {/* Toolbar superior */}
      <div className="crud-card-toolbar">
        <div className="crud-toolbar-left">
          <label className="crud-rows">
            Mostrar
            <select
              value={pageSize}
              onChange={() => {}}
              disabled
              style={{ width: 60 }}
            >
              <option>{pageSize}</option>
            </select>
            registros
          </label>
        </div>
        <div className="crud-toolbar-right">
          <input
            type="text"
            className="crud-search-input"
            placeholder={searchPlaceholder}
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="crud-table-wrap">
        <table className="crud-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {actions && <th className="crud-actions-col">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="crud-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibles.map((row, i) => (
                <tr key={row.id ?? i}>
                  {columns.map((c) => (
                    <td key={c.key} data-label={c.label}>
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="crud-actions">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="crud-pagination">
        <div className="crud-pagination-info">
          Mostrando {filtradas.length === 0 ? 0 : inicio + 1} a {fin} de {filtradas.length} registros
        </div>
        <div className="crud-pagination-controls">
          <button
            className="crud-page-btn"
            disabled={paginaActual === 1}
            onClick={() => setPagina(paginaActual - 1)}
          >
            Anterior
          </button>
          {rangoPaginas().map((p, idx) =>
            p === '...' ? (
              <span key={`e${idx}`} className="crud-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`crud-page-num ${p === paginaActual ? 'active' : ''}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="crud-page-btn"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPagina(paginaActual + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}