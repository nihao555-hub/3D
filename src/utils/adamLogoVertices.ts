// 加载动画用的点云：立方体线框（12 条棱均匀采样）。
// 导出名沿用旧版以避免改动调用方。
function cubeEdgePoints(perEdge: number): number[] {
  const corners = [-1, 1] as const;
  const pts: number[] = [];
  for (const a of corners) {
    for (const b of corners) {
      for (let i = 0; i < perEdge; i++) {
        const t = -1 + (2 * i) / (perEdge - 1);
        pts.push(t, a, b); // 平行于 X 轴的 4 条棱
        pts.push(a, t, b); // 平行于 Y 轴的 4 条棱
        pts.push(a, b, t); // 平行于 Z 轴的 4 条棱
      }
    }
  }
  return pts;
}

export const adamLogoVertices = cubeEdgePoints(56);
