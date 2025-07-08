const { createApp } = Vue;

createApp({
  data() {
    return {
      series: [],
      mostrarAdultos: false
    };
  },
  computed: {
    seriesFiltradasPorTipo() {
      const grupos = {};
      for (const serie of this.series) {
        const tipo = serie.tipo_historieta || 'Sin categoría';
        if (!this.mostrarAdultos && tipo === '+18') continue;
        if (!grupos[tipo]) grupos[tipo] = [];
        grupos[tipo].push(serie);
      }
      return grupos;
    }
  },
  methods: {
    obtenerEnlaceSerie(serie) {
      const tipo = encodeURIComponent(serie.tipo_historieta || '');
      return `serie.html?id=${serie.id}&tipo=${tipo}`;
    },
    estadoTexto(estado) {
      switch (estado) {
        case 'finalizado': return 'Finalizado';
        case 'publicandose': return 'Publicándose';
        case 'pausa': return 'En pausa';
        default: return '';
      }
    },
    estadoClass(estado) {
      return {
        'finalizado': estado === 'finalizado',
        'publicandose': estado === 'publicandose',
        'pausa': estado === 'pausa'
      };
    }
  },
  async mounted() {
    try {
      const res = await fetch('series.json');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      this.series = await res.json();
    } catch (error) {
      console.error('Error cargando series.json:', error);
    }
  }
}).mount('#app');
