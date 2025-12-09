import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state={hasError:false}; }
  static getDerivedStateFromError(){ return {hasError:true}; }
  componentDidCatch(err, info){ console.error("UI crash:", err, info); }
  render(){ return this.state.hasError ? <div className="p-6">Something broke. Check console (F12).</div> : this.props.children; }
}
