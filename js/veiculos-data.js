/*
 * Estoque do site — busca ao vivo no Supabase (mesma base do painel /admin,
 * view pública `public_vehicles`) assim que a página carrega. Qualquer carro
 * cadastrado/editado no painel (com status "Disponível") aparece aqui sem
 * precisar tocar neste arquivo.
 *
 * MANUAL_VEICULOS abaixo são os 2 carros com ficha 100% escrita à mão
 * (fotos e texto reais, capturados antes do painel existir) — continuam
 * fixos, sempre aparecem junto com o que vier do Supabase. Se um dia entrarem
 * no painel, pode apagar as entradas aqui (as páginas em veiculos/golf/ e
 * veiculos/tcross/ continuam existindo e podendo ser deletadas à parte).
 *
 * Consumido por: js/main.js (home), js/estoque.js (/estoque) e
 * js/veiculo-page.js (/veiculo/:id) — todos leem `window.VEICULOS_DESTAQUE`
 * só depois de aguardar `window.VEICULOS_READY`.
 */

const SUPABASE_URL = "https://xmubechjrhjhddnximca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdWJlY2hqcmhqaGRkbnhpbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NjczODIsImV4cCI6MjEwMjI0MzM4Mn0.m0hHBzV5VD9lUq5fMdqGZthQsEiQnhnTKJBraxoBlxY";

const MANUAL_VEICULOS = [
  {
    id: "golf",
    path: "/veiculos/golf/",
    slug: "golf",
    nome: "Volkswagen Golf Highline 1.4 TSI",
    marca: "Volkswagen",
    categoria: "Hatch",
    cambio: "Automático",
    ano: "2014/2015",
    combustivel: "Gasolina",
    km: 135000,
    preco: 88000,
    foto: "/veiculos/golf/sul_veiculosmt_1784845377_3947888468238833654_27165061037.webp",
    fotoPos: "center 80%",
  },
  {
    id: "tcross",
    path: "/veiculos/tcross/",
    slug: "tcross",
    nome: "Volkswagen T-Cross Highline 250 TSI",
    marca: "Volkswagen",
    categoria: "SUV",
    cambio: "Automático",
    ano: "2024/2025",
    combustivel: "Flex",
    km: 59000,
    preco: 140000,
    foto: "/veiculos/tcross/sul_veiculosmt_1785413315_3952652335760688180_27165061037.webp",
    fotoPos: "center 80%",
  },
];

// DB (public_vehicles) → shape usado pelo site. `images`/`thumbnails` já vêm
// como URLs públicas completas do R2 (ver lib/uploads/r2.ts no admin-app).
function mapSupabaseRow(row) {
  const ano = row.year_model ? `${row.year}/${row.year_model}` : row.year ? `${row.year}` : "";
  const fotos = (row.images && row.images.length ? row.images : []);
  const thumb = (row.thumbnails && row.thumbnails[0]) || fotos[0] || "";
  return {
    id: row.id,
    path: "/veiculo/" + row.id,
    slug: row.id,
    nome: row.name,
    marca: row.brand,
    categoria: row.category || "",
    cambio: row.transmission || "",
    ano,
    combustivel: row.fuel || "",
    motor: row.motor || "",
    km: row.km || 0,
    preco: Number(row.price) || 0,
    foto: thumb,
    fotos: fotos,
    fotoPos: null,
    optionals: row.optionals || [],
    isPremium: !!row.is_premium,
    isNew: !!row.is_new,
  };
}

// Valor inicial síncrono (só o manual) — cobre qualquer código que leia
// VEICULOS_DESTAQUE direto, sem esperar VEICULOS_READY, antes do fetch terminar.
window.VEICULOS_DESTAQUE = MANUAL_VEICULOS.slice();

window.VEICULOS_READY = (async () => {
  try {
    const url = `${SUPABASE_URL}/rest/v1/public_vehicles?select=*&order=created_at.desc`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
    const rows = await res.json();
    const dinamicos = (Array.isArray(rows) ? rows : [])
      .map(mapSupabaseRow)
      .sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
    window.VEICULOS_DESTAQUE = dinamicos.concat(MANUAL_VEICULOS);
  } catch (err) {
    console.warn("[veiculos-data] usando só o estoque manual (Supabase indisponível):", err.message);
    window.VEICULOS_DESTAQUE = MANUAL_VEICULOS.slice();
  }
  return window.VEICULOS_DESTAQUE;
})();
