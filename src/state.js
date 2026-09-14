export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function createInitialState() {
  return {
    collection: {
      name: '',
      description: '',
      license: '',
      datePublished: todayIsoDate(),
    },
    files: [],
  };
}
