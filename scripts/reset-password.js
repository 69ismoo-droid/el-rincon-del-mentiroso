import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coar';

// Definir un esquema mínimo para el usuario
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

async function resetPassword() {
  const email = process.argv[2] || 'admin@cusco.coar.edu.pe';
  const newPassword = process.argv[3];

  if (!newPassword) {
    console.error('Error: Debes proporcionar una nueva contraseña.');
    console.log('Uso: node scripts/reset-password.js <email> <nueva_contraseña>');
    process.exit(1);
  }

  try {
    console.log(`Conectando a MongoDB en ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('Conexión exitosa.');

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`Error: No se encontró ningún usuario con el email ${email}`);
      process.exit(1);
    }

    console.log(`Generando hash para la nueva contraseña...`);
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log('---------------------------------------------------------');
    console.log(`¡ÉXITO! La contraseña para ${email} ha sido actualizada.`);
    console.log(`Nueva contraseña: ${newPassword}`);
    console.log('---------------------------------------------------------');

  } catch (error) {
    console.error('Error durante el proceso:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetPassword();
