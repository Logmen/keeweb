// Ранее использовался require.context — расширение webpack. Vite-эквивалент:
// import.meta.glob с eager, который вычисляет модули синхронно при импорте,
// так что describe-блоки успевают зарегистрироваться до mocha.run().
import.meta.glob('./src/**/*.js', { eager: true });
