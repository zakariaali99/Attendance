let load_workbook = (data, finish_loading) => {
    console.log(data, new Date());
    let wb = XLSX.read(data, { type: "array" });
    finish_loading(wb);
};