const { createApp } = Vue;

createApp({
  data() {
    return {
      id: '',
      capitulo: '',
      titulo: '',
      imagenes: [],
      urlsPendientes: [],
      baseURL: 'https://f005.backblazeb2.com/file/ComicsMangas'
    };
  },
  methods: {
    async existeImagen(url) {
      try {
        const resp = await fetch(url, { method: 'HEAD' });
        return resp.ok;
      } catch {
        return false;
      }
    },

    async generarUrls(totalImgs) {
      const carpetaId = encodeURIComponent(this.id);
      const carpetaCapitulo = encodeURIComponent(this.capitulo);
      const ruta = `chapter/%2B18/${carpetaId}/${carpetaCapitulo}`;

      const urlCero = `${this.baseURL}/${ruta}/image_000.webp`;
      const empiezaEnCero = await this.existeImagen(urlCero);

      this.urlsPendientes = [];
      const startIndex = empiezaEnCero ? 0 : 1;

      for (let i = startIndex; i < totalImgs + startIndex; i++) {
        const num = i.toString().padStart(3, '0');
        const url = `${this.baseURL}/${ruta}/image_${num}.webp`;
        this.urlsPendientes.push(url);
      }
    },

    cargarImagenSecuencial() {
      if (this.urlsPendientes.length === 0) return;

      const url = this.urlsPendientes.shift();
      const img = new Image();

      img.onload = () => {
        this.imagenes.push(url);
        this.cargarImagenSecuencial();
      };

      img.onerror = () => {
        console.warn('Error cargando imagen:', url);
        this.urlsPendientes = [];
      };

      img.src = url;
    },

    async fetchSerieInfo() {
      try {
        const res = await fetch('series.json');
        const series = await res.json();
        const serie = series.find(s => s.id === this.id);
        if (serie) {
          this.titulo = serie.titulo;
          const totalImgs = serie.capitulos?.[this.capitulo] || 0;
          if (totalImgs > 0) {
            await this.generarUrls(totalImgs);
            this.cargarImagenSecuencial();
          } else {
            console.warn('No se encontró número de imágenes para el capítulo');
          }
        }
      } catch (error) {
        console.error('Error cargando series.json:', error);
      }
    }
  },

  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.id = params.get('id');
    this.capitulo = params.get('cap');
    if (this.id && this.capitulo) {
      this.fetchSerieInfo();
    }
  }
}).mount('#app');
