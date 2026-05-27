<?php

namespace AmzsCMS\GalleryBundle\Form;

use AmzsCMS\GalleryBundle\Entity\GalleryPictures;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class GalleryPicturesType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class, [
                'label' => 'Tên hiển thị',
                'required' => false,
                'attr' => ['class' => 'form-control', 'placeholder' => 'Nhập tên ảnh...']
            ])
            ->add('title', TextType::class, [
                'label' => 'Tiêu đề (Title)',
                'required' => false,
                'attr' => ['class' => 'form-control', 'placeholder' => 'Nhập tiêu đề ảnh...']
            ])
            ->add('subTitle', TextType::class, [
                'label' => 'Phụ đề (SubTitle)',
                'required' => false,
                'attr' => ['class' => 'form-control', 'placeholder' => 'Nhập phụ đề...']
            ])
            ->add('link', TextType::class, [
                'label' => 'Đường dẫn liên kết (Link URL)',
                'required' => false,
                'attr' => ['class' => 'form-control', 'placeholder' => 'https://...']
            ])
            ->add('urlVideo', TextType::class, [
                'label' => 'Đường dẫn Video (Nếu có)',
                'required' => false,
                'attr' => ['class' => 'form-control', 'placeholder' => 'Youtube, Vimeo link...']
            ])
            ->add('sortOrder', IntegerType::class, [
                'label' => 'Thứ tự sắp xếp',
                'required' => false,
                'attr' => ['class' => 'form-control', 'value' => 0]
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'data_class' => GalleryPictures::class,
        ]);
    }
}