const copyKeys = document.getElementById('copyKeys');
const copyM3u8DL = document.getElementById('copyM3u8DL');

const copyUrl = document.getElementById('copyUrl');
const downloadButton = document.getElementById('downloadButton');
const exitButton = document.getElementById('exitButton');
const keyInput = document.getElementById('keyInput');

copyKeys.addEventListener('click', () => {
  let keys = keyInput.value;
  let decryptionKeys = keys.split('Decryption Key(s):')[1].trim();
  copyTextToClipboard(decryptionKeys);
});

copyUrl.addEventListener('click', () => {
  let keys = keyInput.value;
  let streamUrls = keys.split('Stream Url(s):')[1].split('Decryption Key(s):')[0].trim();
  copyTextToClipboard(streamUrls);
});

downloadButton.addEventListener('click', () => {
  let keys = keyInput.value;
  let lines = keys.split('\n');
  let initValue = lines[0].substring(6).trim();
  let streamUrls = keys.split('Stream Url(s):')[1].split('Decryption Key(s):')[0].trim();

  if (streamUrls.includes('\n')) {
    let urls = streamUrls.split('\n');
    let filteredUrls = urls.filter(url => url.trim() !== '');
    streamUrls = filteredUrls.join('\n');
  }

  let decryptionKeys = [];
  for (let i = 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('--key')) {
      let parts = line.split(':');
      let kid = parts[0].substring(6);
      let key = parts[1];
      decryptionKeys.push({
        kid: kid,
        key: key,
      });
    }
  }

  let data = [
    {
      init_data: initValue,
      stream_url: streamUrls,
      keys: decryptionKeys,
    },
  ];

  let json = JSON.stringify(data, null, 2);
  downloadDataAsFile(json, 'keys.json');
});

copyM3u8DL.addEventListener('click', () => {
  let keys = keyInput.value;
  let streamUrls = keys.split('Stream Url(s):')[1].split('Decryption Key(s):')[0].trim().split("\n")[0].trim();
  let decryptionKeys = keys.split('Decryption Key(s):')[1].trim();
  const command = `N_m3u8DL-RE -M format=mkv:muxer=mkvmerge --use-shaka-packager ${decryptionKeys} '${streamUrls}'`;
  copyTextToClipboard(command);
});

exitButton.addEventListener('click', () => {
  window.close();
});

function copyTextToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Text copied to clipboard:', text);
    })
    .catch((err) => {
      console.error('Failed to copy text:', err);
    });
}

function downloadDataAsFile(data, filename) {
  let downloadLink = document.createElement('a');
  downloadLink.href = 'data:application/octet-stream,' + encodeURIComponent(data);
  downloadLink.download = filename;
  downloadLink.click();
}
