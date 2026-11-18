import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { extractErrorMessage, register } from '../../services/auth';

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
}

/**
 * Màn đăng ký — email giáo dục (.edu / .edu.vn), validation khớp luật backend.
 * Thành công -> sang màn nhập OTP.
 */
export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    setSubmitting(true);
    try {
      await register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      message.success(translate('register:success'));
      navigate(`/otp-verify?email=${encodeURIComponent(values.email)}`);
    } catch (e) {
      message.error(extractErrorMessage(e) ?? translate('common:unknownError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          {translate('register:title')}
        </Typography.Title>
        <Form<RegisterFormValues> layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="fullName"
            label={translate('register:fullName')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', { field: translate('register:fullName') }),
              },
            ]}
          >
            <Input placeholder={translate('register:fullNamePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="email"
            label={translate('register:email')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', { field: translate('register:email') }),
              },
              { type: 'email', message: translate('common:validation.email', { field: translate('register:email') }) },
              {
                pattern: COMMON_VALIDATION_PATTERN.EDU_EMAIL,
                message: translate('register:emailHint'),
              },
            ]}
          >
            <Input placeholder={translate('register:emailPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="password"
            label={translate('register:password')}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', { field: translate('register:password') }),
              },
              { min: 8, message: translate('register:passwordMin') },
            ]}
          >
            <Input.Password placeholder={translate('register:passwordPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="confirm"
            label={translate('register:confirm')}
            dependencies={['password']}
            rules={[
              {
                required: true,
                message: translate('common:validation.required', { field: translate('register:confirm') }),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(translate('register:confirmNotMatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={translate('register:confirmPlaceholder')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {translate('register:submit')}
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
          {translate('register:haveAccount')}{' '}
          <Link to="/login">{translate('register:toLogin')}</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
