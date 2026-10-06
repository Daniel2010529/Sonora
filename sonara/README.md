# SONARA — Supabase + Render

SONARA es una plataforma musical full-stack preparada para desplegarse en Render y usar Supabase como backend de datos, autenticación y almacenamiento.

## Arquitectura

- **Frontend:** HTML/CSS/JS responsive.
- **Render:** servidor Node/Express, API y hosting del frontend.
- **Supabase Auth:** registro, login, sesiones y usuarios.
- **Supabase Postgres:** perfiles, canciones, playlists, likes, follows y reproducciones.
- **Supabase Storage:** archivos de audio y portadas.
- **RLS:** cada usuario puede modificar sus propios datos; las canciones públicas son visibles para todos.

## 1. Crear proyecto Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta `supabase/schema.sql` completo.
4. En Project Settings → API copia:
   - Project URL
   - anon/public key
   - service_role key (solo para Render, nunca para el navegador)

## 2. Configurar Render

Crea un Web Service desde este proyecto.

- Build Command: `npm install`
- Start Command: `npm start`

Variables de entorno:

```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
CORS_ORIGIN=https://tu-app.onrender.com
```

`PORT` lo proporciona Render automáticamente.

## 3. Qué funciona

- Registro y login con Supabase Auth.
- Perfil básico creado automáticamente mediante trigger.
- Subida de audio autenticada a Supabase Storage.
- Registro de canciones en Postgres.
- Lectura pública de canciones mediante la API de Render.
- Reproducción desde URLs públicas de Storage.
- Contador de reproducciones vía API.
- Base preparada para playlists, likes, follows y analytics.

## 4. Siguiente fase recomendada

Para producción todavía conviene añadir:

- confirmación/recuperación de email bien configurada;
- subida de portadas;
- playlists persistentes desde la interfaz;
- likes/follows conectados a Postgres;
- feed personalizado;
- analytics por artista;
- moderación y copyright;
- CDN/transcoding para audio grande;
- rate limiting y protección anti-abuso;
- pagos/royalties si se monetiza.

## Seguridad

Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` en frontend, GitHub ni variables públicas. Solo debe existir en Render como secreto.
