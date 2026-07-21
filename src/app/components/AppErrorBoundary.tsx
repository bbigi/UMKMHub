import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Aplikasi gagal dirender", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F7F4EF] p-6 text-center">
        <div className="max-w-md rounded-3xl border border-[#E8E3DA] bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-[#1A1714]">Halaman mengalami masalah</h1>
          <p className="mt-2 text-sm text-[#6B6558]">Muat ulang halaman untuk mencoba kembali. Data yang sudah tersimpan tidak akan terhapus.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-[#1B6B4E] px-5 py-3 text-sm font-bold text-white">
            Muat Ulang
          </button>
        </div>
      </main>
    );
  }
}
