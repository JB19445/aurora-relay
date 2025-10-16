import fetch from 'node-fetch';
function requireEnv(name){const v=process.env[name];if(!v)throw new Error(`Missing env ${name}`);return v;}
export async function extractProxy(post_id){
  const WP=requireEnv('WORDPRESS_URL'); const SECRET=requireEnv('SEOAI_SITE_SECRET');
  const r=await fetch(`${WP}/wp-json/seoai/v1/extract?post_id=${post_id}`,{headers:{'x-seoai-key':SECRET}});
  const out=await r.json(); if(!r.ok) throw new Error('wp_extract_failed: '+JSON.stringify(out)); return out;
}
export async function extractContent(req,res){
  try{const post_id=parseInt(req.query.post_id||req.body?.post_id,10);
    if(!post_id) return res.status(400).json({error:'post_id_required'});
    const data=await extractProxy(post_id); return res.json(data);
  }catch(e){console.error(e); return res.status(500).json({error:'relay_error', detail:String(e)});}
}