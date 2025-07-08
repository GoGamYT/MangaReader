const { createApp } = Vue;

createApp({
  data() {
    return {
      series: []
    };
  },
  mounted() {
    fetch('series.json')
      .then(res => res.json())
      .then(data => {
        this.series = data;
      })
      .catch(err => console.error('Error cargando series.json:', err));
  }
}).mount('#app');
