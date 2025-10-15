/**
 * Vercel Serverless Function - サンプルCRUD API
 * メモリベースのストレージ（Vercel環境では関数実行ごとにリセットされる）
 */

// メモリベースのストレージ
let samples = [];
let nextId = 1;

module.exports = async (req, res) => {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエスト処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, query, body } = req;
  const { id } = query;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          // 特定のサンプルを取得
          const sample = samples.find(s => s.id === parseInt(id));
          if (!sample) {
            return res.status(404).json({ error: 'Sample not found' });
          }
          return res.status(200).json(sample);
        } else {
          // 全サンプルを取得
          return res.status(200).json({
            samples: samples,
            count: samples.length,
          });
        }

      case 'POST': {
        // サンプルを作成
        const { name, url, data } = body;

        if (!name || !url || !data) {
          return res.status(400).json({ error: 'name, url, and data are required' });
        }

        const newSample = {
          id: nextId++,
          name,
          url,
          data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        samples.push(newSample);
        console.log(`Sample created: ${newSample.id} - ${newSample.name}`);

        return res.status(201).json(newSample);
      }

      case 'PUT': {
        // サンプルを更新
        if (!id) {
          return res.status(400).json({ error: 'Sample ID is required' });
        }

        const index = samples.findIndex(s => s.id === parseInt(id));

        if (index === -1) {
          return res.status(404).json({ error: 'Sample not found' });
        }

        const { name: updateName, url: updateUrl, data: updateData } = body;

        const updatedSample = {
          ...samples[index],
          name: updateName || samples[index].name,
          url: updateUrl || samples[index].url,
          data: updateData || samples[index].data,
          updatedAt: new Date().toISOString(),
        };

        samples[index] = updatedSample;
        console.log(`Sample updated: ${updatedSample.id} - ${updatedSample.name}`);

        return res.status(200).json(updatedSample);
      }

      case 'DELETE': {
        // サンプルを削除
        if (!id) {
          return res.status(400).json({ error: 'Sample ID is required' });
        }

        const deleteIndex = samples.findIndex(s => s.id === parseInt(id));

        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Sample not found' });
        }

        const deletedSample = samples.splice(deleteIndex, 1)[0];
        console.log(`Sample deleted: ${deletedSample.id} - ${deletedSample.name}`);

        return res.status(200).json({
          message: 'Sample deleted successfully',
          sample: deletedSample,
        });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
};
