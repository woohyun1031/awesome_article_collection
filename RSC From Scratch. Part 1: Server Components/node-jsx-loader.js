import babel from "@babel/core";

const babelOptions = {
  //  Babel 설정 파일 무시
  babelrc: false,
  // 변환을 건너뛸 디렉토리
  ignore: [/\/(build|node_modules)\//],
  // React JSX를 자동적인 런타임에 변환하도록 설정
  plugins: [["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]],
};

export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad);
  // 모듈 형식만
  if (result.format === "module") {
    const opt = Object.assign({ filename: url }, babelOptions);
    const newResult = await babel.transformAsync(result.source, opt);
    if (!newResult) {
      if (typeof result.source === "string") {
        return result;
      }
      return {
        source: Buffer.from(result.source).toString("utf8"),
        format: "module",
      };
    }
    return { source: newResult.code, format: "module" };
  }
  return defaultLoad(url, context, defaultLoad);
}
