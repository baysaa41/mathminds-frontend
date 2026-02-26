function t(s,i=200){if(!s)return"";let r=s.replace(/\[pst\][\s\S]*?\[\/pst\]/g,"[PSTricks зураг]");return r.length>i&&(r=r.substring(0,i)+"..."),r}export{t as s};
