import fetch from 'node-fetch';
import { z } from 'zod';
function requireEnv(name){const v=process.env[name];if(!v)throw new Error(`Missing env ${name}`);return v;}
const EditSchema=z.object({id:z.string(),type:z.enum(['text','heading']),old:z.string().max(20000),new:z.string().max(20000)});
const BodySchema=z.object({post_id:z.number(),edits:z.array(EditSchema).default([]),meta:z.object({title:z.string().max(120).optional(),description:z.string().max(200).optional()}).optional()});
export async function applyProxy(body){
  const parsed=BodySchema.safeParse(body); if(!parsed.success) throw new Error('bad_request: '+JSON.stringify(parsed.error.issues));
  const WP=requireEnv('WORDPRESS_URL'); const SECRET=requireEnv('SEOAI_SITE_SECRET');
  const idem=JSON.stringify(parsed.data).length+':'+parsed.data.post_id;
  const r=await fetch(`${WP}/wp-json/seoai/v1/apply`,{method:'POST',headers:{'Content-Type':'application/json','x-seoai-key':SECRET,'x-idempotency-key':idem},body:JSON.stringify(parsed.data)});
  const out=await r.json(); if(!r.ok||!out.ok) throw new Error('wp_apply_failed: '+JSON.stringify(out)); return out;
}
export async function applyRewrite(req,res){
  try{const out=await applyProxy(req.body); return res.json({ok:true, wp:out});}
  catch(e){console.error(e); return res.status(500).json({error:'relay_error', detail:String(e)});}
}