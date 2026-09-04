// Заглушка для модулей, которых нет в браузере (xmldom, moment).
// В webpack-сборке их роль играли externals: { xmldom: 'null', ... }.
/* eslint-disable no-restricted-syntax, import/no-default-export */
export default null;
