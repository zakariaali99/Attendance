function round(x, precision) {
    let power = Math.pow(10, precision || 0);
    return String(Math.round(x * power) / power);
}