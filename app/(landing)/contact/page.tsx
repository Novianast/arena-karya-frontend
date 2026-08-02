"use client";

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nama = formData.get("nama");
    const pesan = formData.get("pesan");

    const subject = encodeURIComponent(`Pesan dari ${nama}`);
    const body = encodeURIComponent(`Nama: ${nama}\n\nPesan:\n${pesan}`);

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=arenakarya.cs@gmail.com&su=${subject}&body=${body}`, "_blank");
  };
  return (
    <main>
      <section className="mx-auto max-w-6xl mt-28">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold text-[#222]">Hubungi Kami</h1>
            <p className="mt-4 text-lg text-[#333]">
              Punya Pertanyaan, Kritik, atau Saran? Yuk Hubungi Kami
            </p>
          </div>

          <div className="flex justify-center md:justify-end">
            <img
              src="/logo/arena_karya_black.png"
              alt="Arena Karya"
              className="w-72 object-contain"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div>
            <label className="mb-1 block font-medium">Nama</label>
            <input
              type="text"
              name="nama"
              required
              placeholder="Nama Anda"
              className="w-full rounded-md border border-[#1A73E8] bg-white px-4 py-3 outline-none" />
          </div>

          <div>
            <label className="mb-1 block font-medium">Pesan atau Kritik</label>
            <textarea
              name="pesan"
              required
              placeholder="Tulis Pesan Anda"
              rows={6}
              className="w-full resize-none rounded-md border border-[#1A73E8] bg-white px-4 py-3 outline-none"
            />
          </div>

          {/* BUTTON FIX */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-[#1A73E8] px-12 py-3 text-base font-semibold text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Kirim
              <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=open_in_new" />
              <span className="material-symbols-outlined text-xl">open_in_new</span>
            </button>
          </div>
        </form>

        {/* CARD */}
        <div className="mt-24 mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <a
            href="https://wa.me/6281328872526"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-[#1A73E8] bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <img src="/icons/whatsapp.png" className="mx-auto mb-4 w-20" />
            <h3 className="text-2xl font-bold">WhatsApp</h3>
            <p className="mt-3 text-sm text-gray-600">+62 813-2887-2526</p>
          </a>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=arenakarya.cs@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-[#1A73E8] bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <img src="/icons/email.png" className="mx-auto mb-4 w-20" />
            <h3 className="text-2xl font-bold">Email</h3>
            <p className="mt-3 text-sm text-gray-600">arenakarya.cs@gmail.com</p>
          </a>

          <a
            href="https://maps.app.goo.gl/BqQVWXzpzXGdBoo88"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-[#1A73E8] bg-white p-8 text-center shadow-md transition hover:-translate-y-1 hover:shadow-xl"
          >
            <img src="/icons/location.png" className="mx-auto mb-4 w-20" />
            <h3 className="text-2xl font-bold">Alamat</h3>
            <p className="mt-3 text-sm text-gray-600">
              Jl. Prof. Soedarto, Tembalang, Semarang
            </p>
          </a>
        </div>
      </section>
    </main>
  );
}