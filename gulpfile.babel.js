import gulp from 'gulp';
import del from 'del';
import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import minimist from 'minimist';

const $ = require('gulp-load-plugins')();

/*****************************************************
 * 變數 block
 *****************************************************/
var envOptions = {
  string: 'env',
  default: { env: 'develop' },
};
var options = minimist(process.argv.slice(2), envOptions); // process.argv = [node, gulp.js, arg1, arg2, ...]
var envIsPro = options.env === 'production' || options.env == 'pro';

export function envNow(cb) {
  console.log(`env now is: ${options.env}, so envIsPro is ${envIsPro}`);
  console.log(options);
  cb();
}

/*****************************************************
 * 複製檔案 block
 *****************************************************/
export function copy() {
  return gulp
    .src([
      './source/**/**',
      '!source/js/**/**',
      '!source/scss/**/**',
      '!source/pug/**/**',
      '!source/img/**',
    ])
    .pipe(gulp.dest('./public'));
}

/*****************************************************
 * 清除暫存 block
 *****************************************************/
export function clean() {
  return del(['./public', './.tmp']);
}

/*****************************************************
 * HTML 處理 block
 *****************************************************/
// export function ejs() {
//   return gulp
//     .src(['./source/**/*.ejs', './source/**/*.html'])
//     .pipe($.plumber())
//     .pipe($.frontMatter())
//     .pipe(
//       $.layout((file) => {
//         return file.frontMatter;
//       })
//     )
//     .pipe(gulp.dest('./public'))
//     .pipe($.if(!envIsPro, browserSync.stream()));
// }

export function pug() {
  return gulp
    .src('./source/pug/*.pug') // Pug 主檔案路徑
    .pipe(
      $.pug({
        pretty: true,
      })
    ) // 使用 gulp-pug 進行編譯
    .pipe(gulp.dest('./public/')) // 編譯完成輸出路徑
    .pipe($.if(!envIsPro, browserSync.stream()));
}

/*****************************************************
 * CSS 處理 block
 *****************************************************/
export function sass() {
  // PostCSS AutoPrefixer
  const processors = [autoprefixer()];

  return gulp
    .src(['./source/scss/**/*.sass', './source/scss/**/*.scss'])
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe(
      $.sass({
        outputStyle: 'nested',
        includePaths: ['./node_modules/bootstrap/scss'],
      }).on('error', $.sass.logError)
    )
    .pipe($.postcss(processors))
    .pipe($.if(envIsPro, $.cleanCss()))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe($.if(!envIsPro, browserSync.stream()));
}

/*****************************************************
 *  JS 處理 block
 *****************************************************/
export function vendorJS() {
  return gulp
    .src([
      './node_modules/jquery/dist/jquery.slim.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
    ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('./public/js'));
}

/*****************************************************
 *  圖片處理 block
 *****************************************************/
export function imageMin() {
  return gulp
    .src('./source/img/*')
    .pipe($.if(envIsPro, $.imagemin()))
    .pipe(gulp.dest('./public/img'))
    .pipe($.if(!envIsPro, browserSync.stream()));
}

/*****************************************************
 *  實時預覽 block
 *****************************************************/
export function browser() {
  browserSync.init({
    server: {
      baseDir: './public',
      reloadDebounce: 2000,
    },
  });
}

export function watch() {
  // gulp.watch(['./source/**/*.html', './source/**/*.ejs'], ejs);
  gulp.watch(['./source/**/*.jade', './source/**/*.pug'], pug);
  gulp.watch(['./source/scss/**/*.sass', './source/scss/**/*.scss'], sass);
  // gulp.watch('./source/js/**/*.js', babel);
  console.log('watching file ~');
}

/*****************************************************
 *  指令 block
 *****************************************************/
exports.default = gulp.parallel(
  copy,
  imageMin,
  vendorJS,
  sass,
  pug,
  browser,
  watch
);

exports.build = gulp.series(
  gulp.series(clean, copy),
  gulp.parallel(vendorJS, sass, pug, imageMin)
);

// = gulp build --env production
exports.buildPro = gulp.series(
  (cb) => {
    envIsPro = true;
    cb();
  },
  gulp.series(clean, copy),
  gulp.parallel(vendorJS, sass, pug, imageMin)
);

function deploy() {
  return gulp.src('./public/**/*').pipe($.ghPages());
}
exports.deploy = deploy;
