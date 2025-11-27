const Person = require('../models/person');
const User = require('../models/user');

/**
 * Crea automáticamente un SuperAdministrador usando variables de entorno
 * solamente si aún no existe ninguno activo.
 */
const ensureInitialSuperAdmin = async () => {
  try {
    const existingSuperAdmins = await User.countDocuments({ role: 'superadmin', isActive: true });
    if (existingSuperAdmins > 0) {
      // Silenciar en producción
      if (process.env.NODE_ENV !== 'production') {
        console.log(`ℹ️ SuperAdministradores activos encontrados (${existingSuperAdmins}). No se creará uno nuevo.`);
        
        // Buscar y mostrar la información del superadmin maestro existente
        const masterAdmin = await User.findOne({ isMasterSuperAdmin: true }).populate('personRef');
        if (masterAdmin) {
          console.log('---');
          console.log('🔑 Datos del SuperAdministrador existente:');
          console.log(`   Username: ${masterAdmin.username}`);
          if (masterAdmin.personRef) {
            console.log(`   Email: ${masterAdmin.personRef.email}`);
          }
          console.log('   Recuerda: La contraseña es la que está definida en tu variable de entorno SUPERADMIN_PASSWORD.');
          console.log('---');
        }
      }
      return;
    }

    const {
      SUPERADMIN_EMAIL,
      SUPERADMIN_PASSWORD,
      SUPERADMIN_DOC,
      SUPERADMIN_NAME,
      SUPERADMIN_DOC_TYPE,
      SUPERADMIN_GENDER,
      SUPERADMIN_PHONE,
      SUPERADMIN_ADDRESS
    } = process.env;

    if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD || !SUPERADMIN_DOC || !SUPERADMIN_NAME) {
      console.warn('⚠️ Variables de entorno para el SuperAdministrador incompletas. No se creará automáticamente.');
      console.warn('   Requeridas: SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, SUPERADMIN_DOC, SUPERADMIN_NAME');
      return;
    }

    // Parsear nombre completo en campos requeridos por Person
    const nameParts = SUPERADMIN_NAME.trim().split(/\s+/);
    if (nameParts.length < 2) {
      // Silenciar warnings en producción
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ SUPERADMIN_NAME debe incluir al menos nombre y apellido. Ejemplo: "Ana Perez"');
      }
      return;
    }

    const nombre1 = nameParts[0];
    let nombre2 = undefined;
    let apellido1 = nameParts[1];
    let apellido2 = undefined;

    if (nameParts.length === 2) {
      // nombre1 + apellido1 ya asignados
    } else if (nameParts.length === 3) {
      nombre2 = nameParts[1];
      apellido1 = nameParts[2];
    } else {
      // nombre compuesto + apellidos compuestos
      nombre2 = nameParts.slice(1, nameParts.length - 2).join(' ');
      apellido1 = nameParts[nameParts.length - 2];
      apellido2 = nameParts[nameParts.length - 1];
    }

    const personPayload = {
      doc: SUPERADMIN_DOC,
      tipoDoc: SUPERADMIN_DOC_TYPE || 'CC',
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      genero: SUPERADMIN_GENDER || 'Masculino',
      email: SUPERADMIN_EMAIL,
      tipoPersona: 'Colaborador',
      estado: 'Activo',
      tieneCuenta: true,
      celular: SUPERADMIN_PHONE,
      direccion: SUPERADMIN_ADDRESS
    };

    const existingPerson = await Person.findByDoc(SUPERADMIN_DOC);
    let person;

    if (existingPerson) {
      person = existingPerson;
      // Silenciar logs en producción
      if (process.env.NODE_ENV !== 'production') {
        console.log('ℹ️ Persona con documento del SuperAdministrador ya existe. Se reutilizará.');
      }
      person.email = SUPERADMIN_EMAIL;
      person.tipoPersona = 'Colaborador';
      person.estado = 'Activo';
      person.tieneCuenta = true;
      await person.save();
    } else {
      person = await Person.create(personPayload);
      console.log('✅ Persona para SuperAdministrador creada automáticamente.');
    }

    const usernameBase = person.generateUsernameBase();
    const username = await User.generateUniqueUsername(usernameBase);

    const user = await User.create({
      username,
      password: SUPERADMIN_PASSWORD,
      role: 'superadmin',
      personRef: person._id,
      tipoPersona: person.tipoPersona,
      isActive: true,
      isMasterSuperAdmin: true
    });

    // Silenciar logs sensibles en producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('🎉 SuperAdministrador inicial creado automáticamente');
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${SUPERADMIN_PASSWORD}`);
      console.log('   (Guarda esta información de forma segura).');
    }
  } catch (error) {
    console.error('❌ Error creando SuperAdministrador inicial:', error.message);
  }
};

module.exports = {
  ensureInitialSuperAdmin
};
