window.drawInclinedPlane = function(ctx, width, height, angle, mu, mass, simTime) {
  ctx.clearRect(0, 0, width, height);

  const rad = (angle * Math.PI) / 180;
  const g = 9.8;
  let acc = g * (Math.sin(rad) - mu * Math.cos(rad));
  if (acc < 0) acc = 0;

  const dist = 0.5 * acc * simTime * simTime;
  const currentVel = acc * simTime;

  const startX = 80;
  const startY = height - 50;
  const rampLength = Math.min(width - 160, 450);
  const endX = startX + rampLength * Math.cos(rad);
  const endY = startY - rampLength * Math.sin(rad);

  // Draw Ramp Surface
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX, startY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Angle Arc
  ctx.beginPath();
  ctx.arc(startX, startY, 40, -rad, 0);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.font = '12px sans-serif';
  ctx.fillText(`${angle}°`, startX + 48, startY - 8);

  // Sliding Object Block
  const pixelDist = Math.min(dist * 18, rampLength - 35);
  const blockX = endX - pixelDist * Math.cos(rad);
  const blockY = endY + pixelDist * Math.sin(rad);

  ctx.save();
  ctx.translate(blockX, blockY);
  ctx.rotate(-rad);
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(-20, -25, 40, 25);
  ctx.strokeStyle = '#818cf8';
  ctx.strokeRect(-20, -25, 40, 25);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`${mass}kg`, -12, -10);
  ctx.restore();

  // Metrics Data Overlay
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText(`Acceleration: ${acc.toFixed(2)} m/s²`, 20, 30);
  ctx.fillText(`Velocity: ${currentVel.toFixed(2)} m/s`, 20, 50);
  ctx.fillText(`Distance: ${dist.toFixed(2)} m`, 20, 70);
};