import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile,stat} from 'node:fs/promises';
import {PHYSIO_TRACKS} from './coach-tracks.js';
test('all 20 approved recordings are real nonempty MP3 assets',async()=>{
 for(const id of PHYSIO_TRACKS){
  const path='./audio/elevenlabs/'+id+'.mp3';
  const f=await stat(path);
  assert.ok(f.size>=10000,'Too small: '+id);
  const b=await readFile(path);
  const valid=b.subarray(0,3).toString('ascii')==='ID3'||(b[0]===0xff&&(b[1]&0xe0)===0xe0);
  assert.ok(valid,'File must start with ID3 or MPEG audio frame: '+id);
 }
});
