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
        if (!grupos[tipo]) grupos[tipo] = [];
        grupos[tipo].push(serie);
      }
      return grupos;
    }
  },
  async mounted() {
    try {
      const res = await fetch('series.json');
      this.series = await res.json();
    } catch (error) {
      console.error('Error cargando series.json:', error);
    }
  }
}).mount('#app');
