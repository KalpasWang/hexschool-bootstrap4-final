
const gulp = require('gulp');
const pug = require('gulp-pug');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync');
const autoprefixer = require('autoprefixer');
const minimist = require('minimist'); // 用來讀取指令轉成變數
const gulpSequence = require('gulp-sequence').use(gulp);

// production || development
// # gulp --env production
const envOptions = {
  string: 'env',
  default: { env: 'development' }
};
const options = minimist(process.argv.slice(2), envOptions);
console.log(options);

gulp.task('clean', () => {
  return gulp
    .src(['./public', './.tmp'], { read: false, allowEmpty: true }) // 選項讀取：false阻止gulp讀取文件的內容，使此任務更快。
    .pipe($.clean());
});

gulp.task('vendorJs', function () {
  return gulp.src([
    './node_modules/jquery/dist/jquery.slim.min.js',
    './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
  ])
  .pipe($.concat('vendor.js'))
  .pipe(gulp.dest('./public/js'))
})

gulp.task('sass', function () {
  return gulp.src(['./source/scss/**/*.sass', './source/scss/**/*.scss'])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass({ 
      outputStyle: 'nested',
      includePaths: ['./node_modules/bootstrap/scss']
    })
      .on('error', $.sass.logError))
    .pipe($.postcss([autoprefixer()]))
    .pipe($.if(options.env === 'production', $.minifyCss())) // 假設開發環境則壓縮 CSS
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('copy', function () {
  return gulp.src(['./source/**/**', '!source/scss/**/**', '!source/pug/**/**'])
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('pug', () => {
  return gulp
    .src('source/pug/*.pug') // Pug 主檔案路徑
    .pipe(pug({
      pretty: true,
    })) // 使用 gulp-pug 進行編譯
    .pipe(gulp.dest('./public/')); // 編譯完成輸出路徑
});

gulp.task('browserSync', function () {
  browserSync.init({
    server: { baseDir: './public' },
    reloadDebounce: 2000
  })
});

gulp.task('reload', function(){
  browserSync.reload({
    stream: true 
  });
});

gulp.task('watch', function () {
  gulp.watch(
    ['./source/scss/**/*.sass', './source/scss/**/*.scss'],
    gulp.series('sass')
  );
  gulp.watch(
    ['./source/pug/**/*.pug'],
    gulp.series('pug')
  );
  gulp.watch(
    ['./source/**/**', '!./source/scss/**/**', '!./source/pug/**/**'],
    gulp.series('copy')
  );
  gulp.watch(
    ['./public/**/**'],
    gulp.series('reload')
  );
});

gulp.task('deploy', function () {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});

// gulp.task('sequence', gulpSequence('clean', 'copy', 'sass', 'vendorJs', 'sass'));

// gulp.task('default', ['copy', 'sass', 'vendorJs', 'browserSync', 'watch']);

// // gulp.task('build', ['sequence'])
gulp.task(
  'default',
  gulp.series('clean', 'copy', 'sass', 'vendorJs', 'pug', 'browserSync', 'watch')
);

gulp.task('build', gulp.series('clean', 'copy', 'sass', 'vendorJs', 'sass', 'pug'));