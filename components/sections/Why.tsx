import styles from "./Why.module.css";
import Image from "next/image";

export default function Why() {
  const items = [
    {
      icon: "/icons/master_plan_integrate.png",
      title: "Identitas Terpadu",
      desc: "Tidak perlu registrasi ulang dari nol untuk event yang berbeda",
    },
    {
      icon: "/icons/calculator_simple.png",
      title: "Kalkulasi Nilai Otomatis",
      desc: "Akumulasi nilai juri dan penentuan juara 1, 2, 3 diproses real time dan transparan",
    },
    {
      icon: "/icons/medal_1.png",
      title: "Tahapan Lomba Kustom",
      desc: "Mendukung format penilaian dinamis (Proposal, Poster, Prototype, hingga Video)",
    },
  ];

  return (
    <section className={styles.why}>
      <div className="mx-auto max-w-6xl px-6 relative w-full">
        <h2 className={styles.title}>Kenapa ARENA KARYA?</h2>

        <div className={styles.container}>
          {items.map((item, index) => (
            <div className={styles.card} key={index}>
              
              {/* Bagian Kiri */}
              <div className={styles.iconBox}>
                <Image src={item.icon} alt={item.title} width={55} height={55} />
              </div>

              {/* Bagian Kanan */}
              <div className={styles.text}>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}