import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 10000;
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }) : null;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/api/health', (_req,res) => res.json({ ok:true, service:'sonara', database: !!admin, time:new Date().toISOString() }));
app.get('/api/config', (_req,res) => res.json({ supabaseUrl, supabaseAnonKey: anonKey }));

function bearer(req){ return req.headers.authorization?.replace(/^Bearer\s+/i,'') || null; }
async function userFrom(req){
  if(!supabaseUrl || !anonKey) return null;
  const token=bearer(req); if(!token) return null;
  const client=createClient(supabaseUrl, anonKey, { global:{headers:{Authorization:`Bearer ${token}`}} });
  const {data:{user},error}=await client.auth.getUser();
  if(error || !user) return null;
  return user;
}

app.get('/api/me', async (req,res)=>{
  const user=await userFrom(req); if(!user) return res.status(401).json({error:'No autenticado'});
  const {data:profile}=await admin.from('profiles').select('*').eq('id',user.id).maybeSingle();
  res.json({user,profile});
});

app.get('/api/tracks', async (req,res)=>{
  if(!admin) return res.status(503).json({error:'Supabase no configurado'});
  const q=(req.query.q||'').trim();
  let query=admin.from('tracks').select('id,title,artist_name,genre,cover_url,audio_path,plays,created_at,description,profiles(username,display_name,avatar_url)').eq('visibility','public').order('created_at',{ascending:false}).limit(50);
  if(q) query=query.or(`title.ilike.%${q}%,artist_name.ilike.%${q}%,genre.ilike.%${q}%`);
  const {data,error}=await query; if(error) return res.status(400).json({error:error.message});
  const rows=(data||[]).map(t=>({...t,audio_url:admin.storage.from('tracks').getPublicUrl(t.audio_path).data.publicUrl}));
  res.json(rows);
});

app.post('/api/tracks/:id/play', async (req,res)=>{
  if(!admin) return res.status(503).json({error:'Supabase no configurado'});
  const {data:track}=await admin.from('tracks').select('plays').eq('id',req.params.id).single();
  if(!track) return res.status(404).json({error:'Canción no encontrada'});
  const {error}=await admin.from('tracks').update({plays:(track.plays||0)+1}).eq('id',req.params.id);
  if(error) return res.status(400).json({error:error.message});
  res.json({ok:true});
});

app.get('/api/stats', async (_req,res)=>{
  if(!admin) return res.status(503).json({error:'Supabase no configurado'});
  const [{count:users},{count:tracks},{data:plays}]=await Promise.all([
    admin.from('profiles').select('*',{count:'exact',head:true}),
    admin.from('tracks').select('*',{count:'exact',head:true}),
    admin.from('tracks').select('plays')
  ]);
  res.json({users:users||0,tracks:tracks||0,plays:(plays||[]).reduce((n,x)=>n+(x.plays||0),0)});
});

app.use(express.static(path.join(__dirname,'public'), { extensions:['html'] }));
app.use((_req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(port,()=>console.log(`SONARA listening on ${port}`));
