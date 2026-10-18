import {Component} from 'react';
export default class ErrorBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(error){console.error('RNR interface error:',error);}
 render(){return this.state.failed?<div className="page-header"><div className="container"><h1>Не удалось открыть страницу</h1><p>Повторите загрузку. Если ошибка повторится, проверьте подключение API.</p><button className="btn btn-primary" style={{marginTop:24}} onClick={()=>window.location.reload()}>Перезагрузить</button></div></div>:this.props.children;}
}
