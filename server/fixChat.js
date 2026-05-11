import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://simranmadad123_db_user:364133@cluster0.ma4wuaj.mongodb.net/test?retryWrites=true&w=majority').then(() => {
  const Chat = mongoose.model('Chat', new mongoose.Schema({},{strict:false}));
  const id = new mongoose.Types.ObjectId('69fa0eebdd0192d31c3357a9');
  Chat.updateMany(
    { 'users.user': id },
    { $set: { 'users.$[elem].onModel': 'Owner' } },
    { arrayFilters: [{ 'elem.user': id }] }
  ).then(res => {
    console.log('Fixed:', res.modifiedCount);
    process.exit(0);
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
});
