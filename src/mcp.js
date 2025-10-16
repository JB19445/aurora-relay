import express from 'express';
import { extractProxy } from './routes/extract-content.js';
import { applyProxy } from './routes/apply-rewrite.js';
export const mcpRouter = express.Router();
mcpRouter.post('/tools/list', async (req,res)=>{
  res.json({tools:[
    {name:'extract_content',description:'Leest tekst en meta van WordPress-pagina.',input_schema:{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"post_id":{"type":"integer","minimum":1}},"required":["post_id"],"additionalProperties":false},annotations:{readOnlyHint:true}},
    {name:'apply_rewrite',description:'Schrijft SEO-title en meta-description naar WordPress (na toestemming).',input_schema:{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"post_id":{"type":"integer","minimum":1},"title":{"type":"string","maxLength":120},"description":{"type":"string","maxLength":200}},"required":["post_id"],"additionalProperties":false}}
  ]});
});
mcpRouter.post('/tools/call', async (req,res)=>{
  try{
    const {name, arguments: args}=req.body||{};
    if(!name) return res.status(400).json({error:'tool_name_required'});
    if(name==='extract_content'){
      if(!args||typeof args.post_id!=='number') return res.status(400).json({error:'bad_arguments'});
      const result=await extractProxy(args.post_id);
      return res.json({content:JSON.stringify(result), mime_type:'application/json'});
    }
    if(name==='apply_rewrite'){
      if(!args||typeof args.post_id!=='number') return res.status(400).json({error:'bad_arguments'});
      const payload={post_id:args.post_id, edits:[], meta:{}};
      if(args.title) payload.meta.title=args.title;
      if(args.description) payload.meta.description=args.description;
      const result=await applyProxy(payload);
      return res.json({content:JSON.stringify(result), mime_type:'application/json'});
    }
    return res.status(404).json({error:'unknown_tool', name});
  }catch(e){console.error('[mcp/tools/call]', e); return res.status(500).json({error:'mcp_call_failed', detail:String(e)});}
});