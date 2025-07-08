const { createApp } = Vue;

createApp({
  data() {
    return {
      series: [],
      seleccionSerieId: null,
      capitulos: []
    };
  },
  methods: {
    async cargarSeries() {
      try {
        const res = await fetch('series.json');
        this.series = await res.json();
      } catch (error) {
        console.error('Error cargando series.json:', error);
      }
    },
    seleccionarSerie(id) {
      this.seleccionSerieId = id;
      const serie = this.series.find(s => s.id === id);
      if (serie && serie.capitulos) {
        // Extraemos los capítulos ordenados (por nombre o por clave)
        this.capitulos = Object.keys(serie.capitulos).sort();
      } else {
        this.capitulos = [];
      }
    }
  },
  mounted() {
    this.cargarSeries();
  }
}).mount('#app');
