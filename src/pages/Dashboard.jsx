import { useEffect, useState } from "react";
import { getNoticiasUltimos7Dias } from "../api/noticias";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getNoticiasUltimos7Dias();

        // ordena cronologicamente (do mais antigo para o mais recente)
        const ordenado = [...res].sort(
          (a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime()
        );

        // formata datas para labels locais curtas (sem alterar ordem)
        const formatado = ordenado.map(item => ({
          dia: new Date(item.dia + "T00:00:00").toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
          }),
          total: item.total,
        }));

        setDados(formatado);
      } catch {
        setErro("Falha ao carregar estatísticas de notícias.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bem-vindo ao painel da prefeitura de Juiz de Fora.</p>
      </div>

      <div className="bg-white rounded-lg p-4 shadow border">
        <h2 className="text-lg font-semibold mb-3">
          Notícias inseridas (últimos 7 dias)
        </h2>

        {loading && <p>Carregando gráfico...</p>}
        {erro && <p className="text-red-600">{erro}</p>}

        {!loading && !erro && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dados}
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
