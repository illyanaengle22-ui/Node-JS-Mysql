import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
const API_URL = "http://localhost:3000"

const welcomeImg =
  "https://i.pinimg.com/originals/ea/8b/13/ea8b137fbc46bea2f12cc9087e57053d.gif"

function App() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mensaje, setMensaje] = useState("")

  const [usuarioLogueado, setUsuarioLogueado] = useState(null)

  const [usuarios, setUsuarios] = useState([])
  const [mostrarLista, setMostrarLista] = useState(false)

  const limpiarCampos = () => {
    setNombre("")
    setEmail("")
    setPassword("")
  }

  //POST
  const handleRegistro = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          email,
          password
        }),
      })

      const data = await res.json()

      setMensaje(data.msg)

      if (res.ok) {
        limpiarCampos()
      }

    } catch (error) {
      setMensaje("Error al registrar")
    }
  }

  //LOGIN
  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setUsuarioLogueado(data.nombre)
        setMensaje("")
      } else {
        setMensaje(data.msg || "Correo o contraseña incorrectos")
      }

    } catch (error) {
      setMensaje("Error al iniciar sesión")
    }
  }

  //LOGOUT
  const handleLogout = () => {
    setUsuarioLogueado(null)
    limpiarCampos()
    setMensaje("")
  }

  //PUT
  const handleCambiarUsuario = async (e) => {
  e.preventDefault()

  const id = prompt("ID del usuario a modificar:")

  if (!id) {
    return
  }

  if (!nombre || !email) {
    setMensaje("Para actualizar necesitas nombre y correo")
    return
  }

  try {
    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre,
        email,
        password: password || undefined,
      }),
    })

    const data = await res.json()

    setMensaje(data.msg)

    if (res.ok) {
      limpiarCampos()
    }

  } catch (error) {
    setMensaje("Error al actualizar")
  }
}
 /*  const handleCambiarUsuario = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          nombre,
          password: password || undefined,
        }),
      })

      const data = await res.json()

      setMensaje(data.msg)

      if (res.ok) {
        limpiarCampos()
      }

    } catch (error) {
      setMensaje("Error al actualizar")
    }
  } */

  //DELETE
  const handleDelete = async (e) => {
    e.preventDefault()

    const id = prompt("ID del usuario a borrar:")

    if (!id) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/usuarios/${id}`, {
        method: "DELETE",
      })

      const data = await res.json()

      setMensaje(data.msg)

    } catch (error) {
      setMensaje("Error al borrar")
    }
  }

  //GET
  const handleVerUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios`)

      const data = await res.json()

      setUsuarios(data.usuarios || data)
      setMostrarLista(true)

    } catch (error) {
      setMensaje("Error al obtener usuarios")
    }
  }
//Bienvenida
  if (usuarioLogueado) {
    return (
      <section id="center">

        <img src={welcomeImg} alt="Gato de bienvenida" style={{
            width: "180px",
            height: "180px",
            objectFit: "cover",
            borderRadius: "20px"
          }}
        />

        <h1>Bienvenido, {usuarioLogueado}</h1>

        <button type="button" onClick={handleLogout}>Cerrar sesión</button>

      </section>
    )
  }
//principal
  return (
    <>
      <section id="center">

        <div className="hero"></div>

        <h2>Illyana Julienne Engle Reyes</h2>

        {mensaje && (
          <p>{mensaje}</p>
        )}

        <form>
          <label htmlFor="nombre">Nombre</label>
          <input type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required/>
          <label htmlFor="correo">Correo</label>

          <input type="text" id="correo" value={email} onChange={(e) => setEmail(e.target.value)}required/>

          <label htmlFor="password">Contraseña</label>

          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>

          <button type="button" onClick={handleRegistro}>Registrarse</button>

          <button type="button" onClick={handleLogin}>Iniciar sesión</button>

          <button type="button" onClick={handleDelete}>Borrar usuario</button>

          <button type="button" onClick={handleCambiarUsuario}>Cambiar usuario</button>

        <button type="button" className="btn-usuarios" onClick={handleVerUsuarios}>Ver todos los usuarios</button>
        </form>

         {mostrarLista && (
          <div className="modal-fondo" onClick={() => setMostrarLista(false)}>

            <div className="modal" onClick={(e) => e.stopPropagation()}>

              <div className="modal-header">
                <h2>
                  Usuarios registrados
                </h2>
                <button type="button" className="modal-cerrar" onClick={() => setMostrarLista(false)}> × </button>

              </div>

              <div className="tabla-contenedor">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id}>
                        <td>
                          {u.id}
                        </td>
                        <td>
                          {u.nombre}
                        </td>
                        <td>
                          {u.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </section>

      <div className="ticks"></div>
      <div className="ticks"></div>
    </>
  )
}

export default App