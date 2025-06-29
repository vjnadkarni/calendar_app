import Calendar from './components/Calendar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Calendar App</h1>
      <Calendar />
    </div>
  );
}
