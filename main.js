import './style.css'

const $ = q => document.querySelector(q);
const $loader = $('#loader')
const $status = $("#status");


function loading(v) {
  if (v) {
    $loader.style.display = 'block'
    $loader.textContent = v;
  } else {
    $loader.style.display = 'none'
    $loader.textContent = '';
  }
}

addEventListener('dragover', (e) => {
  e.preventDefault()
  return false;
})

addEventListener('drop', async (e) => {
  e.preventDefault()

  const files = (e.files || e.dataTransfer.files);
  $status.textContent = `Loaded ${files.length} files`;
  let i = 1;

  for (const file of files) {
    if (file.type.startsWith("image/heic") || file.type.startsWith("image/heif")) {
      loading(`Convert: ${i}/${files.length} - ` + file.name);
      await process(file);
      i++
    }
  }

  $status.textContent = ``;
  loading(null);

})


$('#file').addEventListener('input', async e => {
  $status.textContent = `Loaded ${e.target.files.length} files`;

  let i = 1;
  for (const file of e.target.files) {
    loading(`Convert: ${i}/${e.target.files.length} - ` + file.name);
    await process(file);
    i++
  }
  
  $status.textContent = ``;
  loading(null);
})

async function process(file) {
  return new Promise(async resolve => {

    const heifModule = await wasm_heif({
      onRuntimeInitialized() {

       
        const reader = new FileReader();

        reader.onload = () => {
          const buffer = reader.result;
          const arrayBuffer = new Uint8Array(buffer);
          const pixels = heifModule.decode(arrayBuffer, arrayBuffer.length, false);
          const { width, height } = heifModule.dimensions();
          const canvas = document.createElement('canvas');

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          const imageData = ctx.createImageData(width, height);
          const data = imageData.data;

          let t = 0;

          for (let i = 0; i < data.length; i += 4) {
            data[i] = pixels[t];
            data[i + 1] = pixels[t + 1];
            data[i + 2] = pixels[t + 2];
            data[i + 3] = 255;
            t += 3;
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((b) => {
            resolve()
            const url = URL.createObjectURL(b);
            const anchor = document.createElement('a')
            anchor.download = file.name + ".png";
            anchor.href = url;
            anchor.click()
          }, "image/png")
          heifModule.free();
        }
        reader.readAsArrayBuffer(file);
      },
    });
  })
}


