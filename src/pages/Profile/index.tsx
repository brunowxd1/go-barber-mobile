import React, { useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Feather';
import api from '../../services/api';

import Input from '../../components/Input';
import Button from '../../components/Button';

import getValidationErrors from '../../utils/getValidationErrors';
import {
  Container,
  Title,
  UserAvatarButton,
  UserAvatar,
  BackButton,
} from './styles';
import { useAuth } from '../../hooks/AuthContext';

interface ProfileFormData {
  name: string;
  email: string;
  password: string;
  old_password: string; //eslint-disable-line
  password_confirmation: string; //eslint-disable-line
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const formRef = useRef<FormHandles>(null);
  const navigation = useNavigation();

  const emailInputRef = useRef<TextInput>(null);
  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const handleSignUp = useCallback(
    async (data: ProfileFormData) => {
      try {
        formRef.current?.setErrors({}); //eslint-disable-line
        const schema = Yup.object().shape({
          name: Yup.string().required('Nome obrigatório'),
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Digite um e-mail válido'),
          old_password: Yup.string(),
          password: Yup.string().when('old_password', {
            is: val => !!val.length,
            then: Yup.string().required('Campo obrigatório'),
            otherwise: Yup.string(),
          }),
          password_confirmation: Yup.string()
            .when('old_password', {
              is: val => !!val.length,
              then: Yup.string().required('Campo obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf([Yup.ref('password')], 'Confirmação Incorreta'),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const {
          name,
          email,
          password,
          old_password, //eslint-disable-line
          password_confirmation, //eslint-disable-line
        } = data;

        const formData = {
          name,
          email,
          ...(old_password //eslint-disable-line
            ? {
              password, //eslint-disable-line
              old_password, //eslint-disable-line
              password_confirmation, //eslint-disable-line
            }//eslint-disable-line
            : {}),
        };

        const response = await api.put('profile', formData);

        updateUser(response.data);

        Alert.alert('Perfil atualizado com sucesso');

        navigation.goBack();
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors); //eslint-disable-line

          return;
        }

        Alert.alert(
          'Erro na atualização do perfil',
          'Ocorreu um erro ao atualizar o seu perfil. Tente novamente.',
        );
      }
    },
    [navigation, updateUser],
  );

  const handleUpdateAvatar = useCallback(() => {
    ImagePicker.showImagePicker(
      {
        title: 'Selecione um avatar',
        cancelButtonTitle: 'Cancelar',
        takePhotoButtonTitle: 'Usar câmera',
        chooseFromLibraryButtonTitle: 'Escolher da galeria',
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.error) {
          Alert.alert('Erro ao atualizar seu avatar.');
          return;
        }

        const data = new FormData();

        data.append('avatar', {
          type: 'image/jpeg',
          name: `${user.id}.jpg`,
          uri: response.uri,
        });

        api.patch('users/avatar', data).then(res => {
          updateUser(res.data);
        });
      },
    );
  }, [user.id, updateUser]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flex: 1 }}
        >
          <Container>
            <BackButton onPress={handleGoBack}>
              <Icon name="chevron-left" size={24} color="#999591" />
            </BackButton>
            <UserAvatarButton onPress={handleUpdateAvatar}>
              <UserAvatar source={{ uri: user.avatar_url }} />
            </UserAvatarButton>

            <View>
              <Title>Meu perfil</Title>
            </View>

            <Form initialData={user} ref={formRef} onSubmit={handleSignUp}>
              <Input
                autoCapitalize="words"
                name="name"
                icon="user"
                placeholder="Nome"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
              />
              <Input
                ref={emailInputRef}
                keyboardType="email-address"
                autoCorrect={false}
                autoCapitalize="none"
                name="email"
                icon="mail"
                placeholder="E-mail"
                returnKeyType="next"
                onSubmitEditing={() => oldPasswordInputRef.current?.focus()}
              />
              <Input
                ref={oldPasswordInputRef}
                secureTextEntry
                textContentType="newPassword"
                name="old_password"
                icon="lock"
                containerStyle={{ marginTop: 16 }}
                placeholder="Senha Atual"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />

              <Input
                ref={passwordInputRef}
                secureTextEntry
                textContentType="newPassword"
                name="password"
                icon="lock"
                placeholder="Nova senha"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />

              <Input
                ref={confirmPasswordInputRef}
                secureTextEntry
                textContentType="newPassword"
                name="password_confirmation"
                icon="lock"
                placeholder="Confirmar senha"
                returnKeyType="send"
                onSubmitEditing={() => formRef.current?.submitForm()}
              />
            </Form>

            <Button onPress={() => formRef.current?.submitForm()}>
              Confirmar mudanças
            </Button>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default Profile;
