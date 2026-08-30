import Loader from './Loader';

export default function PageLoader() {
  return (
    <div className="card">
      <Loader label="Loading simulated market data…" />
    </div>
  );
}