import * as tf from '@tensorflow/tfjs';

// Configuration TensorFlow
export function configureTensorFlow() {
  // Définir des options TensorFlow globales
  tf.env().set('WEBGL_FORCE_F16_TEXTURES', false);
  tf.env().set('WEBGL_RENDER_FLOAT32_ENABLED', true);
  tf.env().set('WEBGL_FLUSH_THRESHOLD', 1);
  
  // Initialiser le backend
  tf.setBackend('webgl').then(() => {
    console.log('TensorFlow.js initialized with backend:', tf.getBackend());
  }).catch(err => {
    console.error('Failed to initialize TensorFlow.js backend:', err);
    // Fallback à CPU si WebGL échoue
    tf.setBackend('cpu').then(() => {
      console.log('TensorFlow.js fallback to CPU backend');
    });
  });
}
