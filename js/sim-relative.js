window.drawRelativeMotion = function(ctx, width, height, vA, vB, dir, simTime) {
  ctx.clearRect(0, 0, width, height);

  const scale = 4;
  const laneA_Y = 100;
  const laneB_Y = 200;

  let posA = (vA * simTime * scale) % (width - 100);
  let posB = 0;

  if (dir === 'same') {
    posB = (vB * simTime * scale) % (width - 100);
  } else {
    posB = (width - 100) - ((vB * simTime * scale) % (width - 100));
  }

  const vRel = dir === 'same' ? Math.abs(vA - vB) : vA + vB;

  // Track guides
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(30, laneA_Y + 15); ctx.lineTo(width - 30, laneA_Y + 15);
  ctx.moveTo(30, laneB_Y + 15); ctx.lineTo(width - 30, laneB_Y + 15);
  ctx.stroke();
  ctx.setLineDash([]);

  // Object A
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.roundRect(40 + posA, laneA_Y - 15, 50, 25, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText(`A (${vA}m/s)`, 45 + posA, laneA_Y + 2);

  // Object B
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(40 + posB, laneB_Y - 15, 50, 25, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`B (${vB}m/s)`, 45 + posB, laneB_Y + 2);

  // Metrics Display
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText(`Relative Velocity: ${vRel.toFixed(1)} m/s`, 20, 30);
  ctx.fillText(`Direction Mode: ${dir === 'same' ? 'Same Direction' : 'Opposite Direction'}`, 20, 50);
};