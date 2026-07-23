import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  FlatList, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- CONFIGURAÇÃO DE CATEGORIAS ---
const CATEGORIAS_CONFIG = {
  'Fixa': ['Luz', 'Cartão de Crédito', 'Gasolina Trabalho', 'Outros'],
  'Variável': [
    'Moto - Gasolina', 'Moto - Peças', 
    'Carro - Gasolina', 'Carro - Peças', 
    'Filho', 'Filha', 'Esposa', 'Lanche', 
    'Doação', 'Empréstimo', 'Gasolina', 'Diversos', 'Outros'
  ]
};

export default function App() {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [tipoCategoria, setTipoCategoria] = useState('Fixa');
  const [subCategoria, setSubCategoria] = useState(CATEGORIAS_CONFIG['Fixa'][0]);
  const [gastos, setGastos] = useState([]);
  const [historico, setHistorico] = useState([]); // Salva meses fechados

  // Carregar dados ao iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Salvar dados sempre que a lista de gastos mudar
  useEffect(() => {
    saveData();
  }, [gastos]);

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('@meus_gastos', JSON.stringify(gastos));
      await AsyncStorage.setItem('@meu_historico', JSON.stringify(historico));
    } catch (e) {
      console.error("Erro ao salvar", e);
    }
  };

  const loadData = async () => {
    try {
      const savedGastos = await AsyncStorage.getItem('@meus_gastos');
      const savedHistorico = await AsyncStorage.getItem('@meu_historico');
      if (savedGastos) setGastos(JSON.parse(savedGastos));
      if (savedHistorico) setHistorico(JSON.parse(savedHistorico));
    } catch (e) {
      console.error("Erro ao carregar", e);
    }
  };

  const adicionarGasto = () => {
    if (!descricao || !valor) {
      Alert.alert("Erro", "Preencha todos os campos!");
      return;
    }

    const novoGasto = {
      id: Date.now().toString(),
      descricao,
      valor: parseFloat(valor.replace(',', '.')),
      tipo: tipoCategoria,
      categoria: subCategoria,
      data: new Date().toLocaleDateString('pt-BR'),
      mesReferencia: new Date().getMonth(), // 0-11
      anoReferencia: new Date().getFullYear()
    };

    setGastos([novoGasto, ...gastos]);
    setDescricao('');
    setValor('');
  };

  const fecharMes = () => {
    const totalMes = gastos.reduce((acc, item) => acc + item.valor, 0);
    const mesAtual = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    Alert.alert(
      "Fechar Mês",
      `Total do mês (${mesAtual}): R$ ${totalMes.toFixed(2)}\n\nIsso moverá os gastos para o histórico e limpará a lista atual.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Confirmar", 
          onPress: () => {
            const novoRegistroHistorico = {
              mes: mesAtual,
              total: totalMes,
              itens: [...gastos]
            };
            setHistorico([novoRegistroHistorico, ...historico.slice(0, 5)]); // Mantém últimos 6 (5 + atual)
            setGastos([]);
          } 
        }
      ]
    );
  };

  const totalGastoAtual = gastos.reduce((acc, item) => acc + item.valor, 0);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      
      {/* HEADER COM TOTAL */}
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Dashboard</Text>
        <Text style={styles.headerTotal}>R$ {totalGastoAtual.toFixed(2)}</Text>
        <Text style={styles.headerSub}>Gastos do Mês Atual</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* FORMULÁRIO */}
        <View style={styles.card}>
          <TextInput 
            style={styles.input} 
            placeholder="Descrição do gasto" 
            value={descricao}
            onChangeText={setDescricao}
          />
          <TextInput 
            style={styles.input} 
            placeholder="Valor R$" 
            keyboardType="numeric"
            value={valor}
            onChangeText={setValor}
          />

          {/* Seleção Tipo (Fixa/Variável) */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.btnTipo, tipoCategoria === 'Fixa' && styles.btnTipoAtivo]}
              onPress={() => {
                setTipoCategoria('Fixa');
                setSubCategoria(CATEGORIAS_CONFIG['Fixa'][0]);
              }}
            >
              <Text style={tipoCategoria === 'Fixa' ? styles.textWhite : styles.textBlack}>Fixa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnTipo, tipoCategoria === 'Variável' && styles.btnTipoAtivo]}
              onPress={() => {
                setTipoCategoria('Variável');
                setSubCategoria(CATEGORIAS_CONFIG['Variável'][0]);
              }}
            >
              <Text style={tipoCategoria === 'Variável' ? styles.textWhite : styles.textBlack}>Variável</Text>
            </TouchableOpacity>
          </View>

          {/* Seleção Sub-Categoria */}
          <Text style={styles.labelSub}>Sub-categoria:</Text>
          <View style={styles.gridCategorias}>
            {CATEGORIAS_CONFIG[tipoCategoria].map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.btnCat, subCategoria === cat && styles.btnCatAtivo]}
                onPress={() => setSubCategoria(cat)}
              >
                <Text style={[styles.textCat, subCategoria === cat && styles.textWhite]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btnAdicionar} onPress={adicionarGasto}>
            <Text style={styles.textWhite}>Adicionar Gasto</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA ATUAL */}
        <Text style={styles.sectionTitle}>Gastos do Mês</Text>
        {gastos.map(item => (
          <View key={item.id} style={styles.itemGasto}>
            <View>
              <Text style={styles.itemDesc}>{item.descricao}</Text>
              <Text style={styles.itemInfo}>{item.categoria} • {item.data}</Text>
            </View>
            <Text style={styles.itemValor}>R$ {item.valor.toFixed(2)}</Text>
          </View>
        ))}

        {/* HISTÓRICO */}
        <Text style={styles.sectionTitle}>Histórico (Últimos Meses)</Text>
        {historico.map((h, index) => (
          <View key={index} style={styles.cardHistorico}>
            <Text style={styles.histMes}>{h.mes}</Text>
            <Text style={styles.histTotal}>Total: R$ {h.total.toFixed(2)}</Text>
          </View>
        ))}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTÃO FIXO DE FECHAR MÊS */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btnFechar} onPress={fecharMes}>
          <Text style={styles.textWhite}>Finalizar Mês e Gerar Histórico</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: { backgroundColor: '#1A237E', padding: 30, alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitulo: { color: '#C5CAE9', fontSize: 16 },
  headerTotal: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  headerSub: { color: '#C5CAE9', fontSize: 14 },
  card: { backgroundColor: '#FFF', margin: 15, padding: 15, borderRadius: 12, elevation: 4 },
  input: { borderBottomWidth: 1, borderColor: '#DDD', marginBottom: 15, padding: 8, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  btnTipo: { paddingVertical: 8, paddingHorizontal: 30, borderRadius: 20, borderWidth: 1, borderColor: '#1A237E' },
  btnTipoAtivo: { backgroundColor: '#1A237E' },
  labelSub: { fontWeight: 'bold', marginBottom: 10, color: '#444' },
  gridCategorias: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  btnCat: { backgroundColor: '#E0E0E0', padding: 8, borderRadius: 8, marginBottom: 8, width: '48%', alignItems: 'center' },
  btnCatAtivo: { backgroundColor: '#4CAF50' },
  textCat: { fontSize: 11, color: '#333' },
  btnAdicionar: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginTop: 20, marginBottom: 10, color: '#333' },
  itemGasto: { backgroundColor: '#FFF', marginHorizontal: 15, marginBottom: 8, padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDesc: { fontSize: 16, fontWeight: 'bold' },
  itemInfo: { fontSize: 12, color: '#777' },
  itemValor: { fontSize: 16, fontWeight: 'bold', color: '#D32F2F' },
  cardHistorico: { backgroundColor: '#E8EAF6', marginHorizontal: 15, padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#3F51B5' },
  histMes: { fontSize: 14, fontWeight: 'bold' },
  histTotal: { fontSize: 16, color: '#1A237E' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 15, backgroundColor: '#FFF' },
  btnFechar: { backgroundColor: '#D32F2F', padding: 15, borderRadius: 10, alignItems: 'center' },
  textWhite: { color: '#FFF', fontWeight: 'bold' },
  textBlack: { color: '#000' },
});
