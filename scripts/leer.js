const { createApp } = Vue;

createApp({
  data() {
    return {
      id: '',
      capitulo: '',
      titulo: '',
      tipo_historieta: '+18',
      imagenes: [],
      urlsPendientes: [],
      baseURL: 'https://f005.backblazeb2.com/file/ComicsMangas',
      series: [],
      listaCapitulos: [] // Lista ordenada de capítulos
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

    async generarUrls(totalImgs, ruta, nombreBase = 'image') {
      const urlCero = `${this.baseURL}/${ruta}/${nombreBase}_000.webp`;
      const urlAltCero = `${this.baseURL}/${ruta}/${nombreBase}_0.webp`;

      const empiezaEnCero = await this.existeImagen(urlCero);
      const empiezaEnAlt = !empiezaEnCero && await this.existeImagen(urlAltCero);

      this.urlsPendientes = [];

      const startIndex = empiezaEnCero ? 0 : (empiezaEnAlt ? 0 : 1);
      const pad = empiezaEnAlt ? 1 : 3;

      for (let i = startIndex; i < totalImgs + startIndex; i++) {
        const num = i.toString().padStart(pad, '0');
        const url = `${this.baseURL}/${ruta}/${nombreBase}_${num}.webp`;
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
        this.series = await res.json();
        const serie = this.series.find(s => s.id === this.id);

        if (serie) {
          this.titulo = serie.titulo;
          this.tipo_historieta = serie.tipo_historieta || '+18';

          // Clase según tipo de historieta
          const appDiv = document.getElementById('app');
          if (appDiv) {
            appDiv.classList.add(`tipo-${this.tipo_historieta.toLowerCase()}`);
          }

          const carpetaTipo = encodeURIComponent(this.tipo_historieta);
          const carpetaId = encodeURIComponent(this.id);

          if (serie.capitulos) {
            this.listaCapitulos = Object.keys(serie.capitulos).sort((a, b) => {
              const numA = parseFloat(a);
              const numB = parseFloat(b);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return a.localeCompare(b);
            });
          }

          if (this.capitulo && serie.capitulos?.[this.capitulo]) {
            const totalImgs = serie.capitulos[this.capitulo];
            const carpetaCapitulo = encodeURIComponent(this.capitulo);
            const ruta = `chapter/${carpetaTipo}/${carpetaId}/${carpetaCapitulo}`;
            await this.generarUrls(totalImgs, ruta);
            this.cargarImagenSecuencial();
          } else if (serie.total) {
            const totalImgs = serie.total;
            const ruta = `chapter/${carpetaTipo}/${carpetaId}`;
            await this.generarUrls(totalImgs, ruta);
            this.cargarImagenSecuencial();
          } else {
            console.warn('No se encontraron capítulos ni total para la serie');
          }
        } else {
          console.warn('Serie no encontrada con id:', this.id);
        }
      } catch (error) {
        console.error('Error cargando series.json:', error);
      }
    },

    cambiarCapitulo(offset) {
      const index = this.listaCapitulos.indexOf(this.capitulo);
      const nuevoIndex = index + offset;

      if (nuevoIndex >= 0 && nuevoIndex < this.listaCapitulos.length) {
        const nuevaCap = this.listaCapitulos[nuevoIndex];
        this.redirigirCapitulo(nuevaCap);
      }
    },

    seleccionarCapitulo(event) {
      const nuevoCap = event.target.value;
      this.redirigirCapitulo(nuevoCap);
    },

    redirigirCapitulo(nuevoCap) {
      const url = new URL(window.location.href);
      url.searchParams.set('cap', nuevoCap);
      window.location.href = url.toString();
    }
  },

  mounted() {
    const params = new URLSearchParams(window.location.search);
    this.id = params.get('id');
    this.capitulo = params.get('cap');
    if (this.id) {
      this.fetchSerieInfo();
    }
  }
}).mount('#app');
