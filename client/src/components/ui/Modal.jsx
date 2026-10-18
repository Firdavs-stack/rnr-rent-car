import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
export default function Modal({title,onClose,children}){
 const ref=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const root=ref.current;
  const focusable=()=>Array.from(root.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')).filter(e=>!e.disabled);
  (focusable()[0]||root).focus();
  const key=e=>{if(e.key==='Escape'){e.preventDefault();onClose();}if(e.key==='Tab'){const elements=focusable(),first=elements[0],last=elements.at(-1);if(!first){e.preventDefault();root.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  root.addEventListener('keydown',key);
  return()=>{root.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus();};
 },[onClose]);
 return createPortal(<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="modal-panel"><div className="section-heading"><h2>{title}</h2><button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Закрыть</button></div>{children}</section></div>,document.body);
}
