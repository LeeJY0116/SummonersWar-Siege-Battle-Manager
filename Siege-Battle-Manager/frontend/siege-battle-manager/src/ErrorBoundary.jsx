import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error);
    console.error("Component stack:", info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, whiteSpace: "pre-wrap" }}>
          <h2>App crashed</h2>
          <div>{String(this.state.error)}</div>
          <hr />
          <div>자세한 내용은 콘솔(ErrorBoundary caught)을 확인해줘.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
