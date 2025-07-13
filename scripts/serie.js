const { createApp } = Vue;

createApp({
  data() {
    return {
      series: [],
      serieId: '',
      titulo: '',
      capitulos: []
    };
  },
  methods: {
    async cargarSeries() {
      try {
        const res = await fetch('series.json');
        this.series = await res.json();

        const serie = this.series.find(s => s.id === this.serieId);
        if (serie) {
          this.titulo = serie.titulo;

          if (serie.capitulos) {
            this.capitulos = Object.keys(serie.capitulos).sort();
          } else if (serie.total) {
            this.capitulos = ['Unico']; // capítulo único
          } else {
            this.capitulos = [];
          }
        } else {
          console.warn('No se encontró la serie con id:', this.serieId);
        }
      } catch (error) {
        console.error('Error cargando series.json:', error);
      }
    },
  },
  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.serieId = params.get('id');
    if (this.serieId) {
      this.cargarSeries();
    }
  }
}).mount('#app');
