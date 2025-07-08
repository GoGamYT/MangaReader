const { createApp } = Vue;

createApp({
  data() {
    return {
      series: []
    };
  },
  computed: {
    seriesPorTipo() {
      const grupos = {};
      for (const serie of this.series) {
        const tipo = serie.tipo_historieta || 'Sin categoría';
        if (!grupos[tipo]) {
          grupos[tipo] = [];
        }
        grupos[tipo].push(serie);
      }
      return grupos;
    }
  },
  methods: {
    obtenerEnlaceSerie(serie) {
      const tipo = encodeURIComponent(serie.tipo_historieta || '');
      return `serie.html?id=${serie.id}&tipo=${tipo}`;
    }
  },
  async mounted() {
    try {
      const res = await fetch('series.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.series = await res.json();
    } catch (error) {
      console.error('Error cargando series.json:', error);
    }
  }
}).mount('#app');
