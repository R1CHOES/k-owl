const Tesseract = require('tesseract.js');

async function testTesseract() {
    console.log("Starting Tesseract...");
    const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => console.log(m)
    });
    
    // PSM 1 = Auto page segmentation with OSD
    await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
    });

    const ret = await worker.recognize('../test_out/page_1_small.png');
    console.log("TEXT:");
    console.log(ret.data.text);
    await worker.terminate();
}

testTesseract();
